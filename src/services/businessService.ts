import { fallbackData, BusinessInfo, Company } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

// AI features disabled - calls routed through server API

const CACHE_KEY = "shane_ruddle_business_info_v3";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export async function saveBusinessInfo(info: Partial<BusinessInfo>): Promise<void> {
  try {
    const settingsRef = doc(db, "settings", "business_info");
    await setDoc(settingsRef, info, { merge: true });
    // Clear cache to force refresh
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, "settings/business_info");
  }
}

export async function getBusinessInfo(forceAI = false): Promise<BusinessInfo> {
  // 1. Check Cache (unless forcing AI)
  if (!forceAI) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log("Using cached business info");
          return data;
        }
      }
    } catch (e) {
      console.warn("Failed to read from cache:", e);
    }
  }

  // 2. Fetch Companies from Firestore
  let firestoreCompanies: Company[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, "companies"));
    firestoreCompanies = querySnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        name: d.name || "",
        description: d.description || "",
        services: d.services || [],
        logo: d.logo || "",
        url: d.url || d.website || "",
        icon: d.icon || "Sparkles"
      };
    });
    console.log(`Fetched ${firestoreCompanies.length} companies from Firestore`);
  } catch (e: any) {
    if (e.message?.includes('Quota limit exceeded')) {
      console.warn("Firestore quota hit, using fallback company data");
    } else {
      handleFirestoreError(e, OperationType.GET, "companies");
    }
  }

  // 3. Check Firestore Settings for Business Info
  let settingsInfo: Partial<BusinessInfo> = {};
  try {
    const settingsDoc = await getDoc(doc(db, "settings", "business_info"));
    if (settingsDoc.exists()) {
      settingsInfo = settingsDoc.data() as Partial<BusinessInfo>;
      console.log("Fetched business info from Firestore settings");
    }
  } catch (e: any) {
    if (e.message?.includes('Quota limit exceeded')) {
      console.warn("Firestore quota hit, using fallback business settings");
    } else {
      handleFirestoreError(e, OperationType.GET, "settings/business_info");
    }
  }

  // 4. Fast Path: If we have enough info or not forcing AI, return immediately
  if (!forceAI && (settingsInfo.about || settingsInfo.tagline)) {
    const finalData: BusinessInfo = {
      name: settingsInfo.name || fallbackData.name,
      tagline: settingsInfo.tagline || fallbackData.tagline,
      about: settingsInfo.about || fallbackData.about,
      values: settingsInfo.values || fallbackData.values,
      companies: firestoreCompanies.length > 0 ? firestoreCompanies : (settingsInfo.companies || fallbackData.companies),
      ownerPhotos: settingsInfo.ownerPhotos || fallbackData.ownerPhotos
    };

    // Update Cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: finalData,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Failed to update cache:", e);
    }

    return finalData;
  }

  // 5. Fetch from Gemini (Only if forced or if we have no settings info at all)
  try {
    console.log("Performing AI research for business info...");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // Use a faster model
      contents: `Research Shane Ruddle's background and core values in Pattaya. 
      
      Provide a concise summary of his background, tagline, and core values. 
      Write it in the first person (from Shane Ruddle's perspective).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tagline: { type: Type.STRING },
            about: { type: Type.STRING },
            values: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "tagline", "about", "values"]
        }
      },
    });

    let jsonStr = response.text || "";
    const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    const result = JSON.parse(jsonStr.trim());
    
    const finalData: BusinessInfo = {
      name: settingsInfo.name || result.name || fallbackData.name,
      tagline: settingsInfo.tagline || result.tagline || fallbackData.tagline,
      about: settingsInfo.about || result.about || fallbackData.about,
      values: settingsInfo.values || (Array.isArray(result.values) ? result.values : fallbackData.values),
      companies: firestoreCompanies.length > 0 ? firestoreCompanies : (settingsInfo.companies || fallbackData.companies),
      ownerPhotos: settingsInfo.ownerPhotos || fallbackData.ownerPhotos
    };
    
    // Update Cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: finalData,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Failed to update cache:", e);
    }

    return finalData;
  } catch (e: any) {
    console.error("Gemini API error or JSON parse error:", e);
    
    const fallback: BusinessInfo = {
      ...fallbackData,
      ...settingsInfo,
      companies: firestoreCompanies.length > 0 ? firestoreCompanies : (settingsInfo.companies || fallbackData.companies)
    } as BusinessInfo;
    return fallback;
  }
}

