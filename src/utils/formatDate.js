export default function formatDateToKorean(value) {
  if (!value && value !== 0) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}년 ${m}월 ${day}일`;
  } catch {
    return "";
  }
}
