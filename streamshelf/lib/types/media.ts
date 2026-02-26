export type StreamVariant = {
  url: string;
  bandwidth?: number;
  resolution?: string;
  label: "4K" | "1080p" | "720p" | "Auto";
};

export type ResolveResult = {
  streamUrl: string;
  referer?: string;
  origin?: string;
  variants: StreamVariant[];
};
