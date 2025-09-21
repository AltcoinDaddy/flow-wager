export const getStatusColor = (status: number) => {
  switch (status) {
    case 0:
      return "text-green-400 bg-green-500/20 border-green-500/30";
    case 1:
      return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    case 2:
      return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    default:
      return "text-gray-400 bg-gray-500/20 border-gray-500/30";
  }
};

export const getStatusName = (status: number): string => {
  switch (status) {
    case 0:
      return "Active";
    case 1:
      return "Resolved";
    case 2:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

const namePool = [
  "hunter",
  "cool",
  "savage",
  "ninja",
  "wizard",
  "ghost",
  "rider",
  "sniper",
  "shadow",
  "blaze",
  "storm",
  "alpha",
  "omega",
  "nova",
  "lion",
  "eagle",
  "panda",
  "otter",
  "falcon",
  "tiger",
  "rhino",
  "brave",
  "bold",
  "curious",
  "eager",
  "mighty",
  "zesty",
  "witty",
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function generateShortNameFromWallet(wallet: string): string {
  const hash = simpleHash(wallet);
  const name = namePool[hash % namePool.length];
  const number = hash % 100;

  return `${name}-${number}`;
}
