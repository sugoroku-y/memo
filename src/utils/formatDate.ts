function formatDate(format: string, date?: Date) {
  date ??= new Date();
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    hh: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
  };
  return format.replace(/YYYY|MM|DD|hh|mm/g, f => map[f]);
}
