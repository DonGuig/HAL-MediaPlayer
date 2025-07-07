import { useRef, useEffect, RefObject } from 'react';

const useRefMounted = (): RefObject<boolean> => {
  const isRef = useRef(true);

  useEffect(() => (): void => {
    isRef.current = false;
  },
    []
  );

  return isRef;
};

export default useRefMounted;
