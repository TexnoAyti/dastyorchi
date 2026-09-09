export function cleanFirestoreData<T extends object>(data: T): T {
  const copy = { ...data } as any;
  Object.keys(copy).forEach(key => {
    if (copy[key] === undefined) {
      delete copy[key];
    } else if (typeof copy[key] === 'object' && copy[key] !== null) {
      if (Array.isArray(copy[key])) {
        // Map arrays and safely strip nested elements
        copy[key] = copy[key].map((item: any) => 
           (typeof item === 'object' && item !== null) ? cleanFirestoreData(item) : item
        );
      } else {
        copy[key] = cleanFirestoreData(copy[key]);
      }
    }
  });
  return copy as T;
}
