// Shared by the cashier's staff list (/staff-check) and the portal's Staff view. No Firebase imports here,
// so the cashier page stays small.

export const COMPANIES = [
  'Hemingways Jomtien', 'Hemingways Lakeside', 'Hemingways Pattaya', 'Cajun Life Cafe',
  'Pattaya Rent a Car', 'Alan Bolton Property Consultants', 'East Coast Real Estate',
];

// Shrinks a photo to 480px so the cashier's list loads fast on a phone.
export const shrinkPhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Could not read that photo.'));
    img.src = URL.createObjectURL(file);
  });
