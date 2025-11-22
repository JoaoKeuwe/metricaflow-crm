// Gera cores consistentes para cada usuário
const USER_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-900", dot: "bg-blue-500" },
  { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-900", dot: "bg-purple-500" },
  { bg: "bg-green-100", border: "border-green-500", text: "text-green-900", dot: "bg-green-500" },
  { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange-900", dot: "bg-orange-500" },
  { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-900", dot: "bg-pink-500" },
  { bg: "bg-cyan-100", border: "border-cyan-500", text: "text-cyan-900", dot: "bg-cyan-500" },
  { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-900", dot: "bg-amber-500" },
  { bg: "bg-teal-100", border: "border-teal-500", text: "text-teal-900", dot: "bg-teal-500" },
  { bg: "bg-indigo-100", border: "border-indigo-500", text: "text-indigo-900", dot: "bg-indigo-500" },
  { bg: "bg-rose-100", border: "border-rose-500", text: "text-rose-900", dot: "bg-rose-500" },
];

// Gera uma cor consistente baseada no ID do usuário
export const getUserColor = (userId: string) => {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

// Retorna todas as cores disponíveis para legenda
export const getAllColors = () => USER_COLORS;
