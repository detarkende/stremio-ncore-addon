// copied from https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes == 0) return '0 Bytes';
  const oneKiloByte = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const sizeIndex = Math.floor(Math.log(bytes) / Math.log(oneKiloByte));
  return `${parseFloat((bytes / Math.pow(oneKiloByte, sizeIndex)).toFixed(decimals))} ${
    sizes[sizeIndex]
  }`;
}
