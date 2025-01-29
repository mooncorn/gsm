export const formatMemoryMB = (bytes: number | undefined): string => {
  if (!bytes) return "0";
  const mb = Math.round(bytes / (1024 * 1024));
  return mb.toLocaleString();
};

export const formatDiskGB = (bytes: number | undefined): string => {
  if (!bytes) return "0";
  const gb = Math.round(bytes / (1024 * 1024 * 1024));
  return gb.toLocaleString();
};

export const formatPercent = (value: number | undefined): string => {
  if (typeof value !== "number") return "0";
  return value.toFixed(1);
};
