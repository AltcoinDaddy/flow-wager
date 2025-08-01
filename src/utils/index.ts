export const getStatusColor = (status: number) => {
    switch (status) {
      case 0: // Active
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case 1: // Paused
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case 2: // Resolved
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };