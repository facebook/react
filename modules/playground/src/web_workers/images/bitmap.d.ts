declare class Bitmap {
  constructor(width: number, height: number);

  subsample(n: number): void;
  dataURL(): string;

  pixel:[any];
}
