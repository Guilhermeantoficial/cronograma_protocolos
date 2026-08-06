export const COD_ORDEM_MAP: Record<string, string> = {
  // CAEd main
  C4: "",
  C5: "106",
  C6: "152",
  C7: "107",
  C8: "153",
  C10: "203",
  // Gráfica main
  E4: "",
  E5: "106",
  E6: "114",
  E7: "107",
  E8: "156",
  E9: "150",
  E10: "151",
  E11: "153",
  E12: "203",
  // Datas Extras (B)
  B6: "001",
  B7: "002",
  B8: "401",
  B10: "064",
  B13: "154",
  B14: "155",
  B15: "156",
  B16: "157",
  B5: "159",
  B9: "051",
  "B9+": "052",
  B17: "160",
  B18: "161",
  B19: "201",
  B20: "202",
  B21: "203",
  B22: "003",
  B23: "258",
  B24: "260",
  B25: "402",
  B26: "403",
  B27: "405",
  B28: "601",
  B29: "650",
  B30: "652",
  B31: "653",
  // Datas Extras (H)
  H5: "001",
  H6: "002",
  H10: "003",
  H8: "064",
  H11: "258",
  H7: "401",
  H9: "402",
  H12: "601",
  H13: "650",
  H14: "652",
  H15: "653",
};

export function getCodOrdem(celula: string): string {
  return COD_ORDEM_MAP[celula] || "";
}

export function getCodOrdemNumeric(celula: string): number {
  const cod = COD_ORDEM_MAP[celula];
  if (!cod) return 0;
  return parseInt(cod, 10) || 0;
}
