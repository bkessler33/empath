interface DeviceDimensions {
    width: number;
    height: number;
  }
  
  interface Device {
    name: string;
    os: string;
    dimensions: DeviceDimensions;
  }
  
  export const devices = {
    pixel7Pro: {
      name: "Pixel 7 Pro",
      os: "Android 13",
      dimensions: {
        width: 412,
        height: 915
      }
    }
  } as const;