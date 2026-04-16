const thBase =
  "py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

const columns = [
  { label: "Матеріал", className: `px-6 ${thBase}` },
  { label: "Артикул", className: `px-4 ${thBase}` },
  { label: "Категорія", className: `px-4 ${thBase}` },
  { label: "Колір", className: `px-4 ${thBase}` },
  { label: "Кількість", className: `px-4 ${thBase}` },
  { label: "Прогноз", className: `px-4 ${thBase}` },
  { label: "Статус", className: `px-4 ${thBase}` },
  { label: "Дії", className: `px-6 text-right ${thBase}` },
] as const;

export function MaterialsTableHeadRow() {
  return (
    <tr className="border-b border-border bg-muted/30">
      {columns.map((col) => (
        <th key={col.label} scope="col" className={col.className}>
          {col.label}
        </th>
      ))}
    </tr>
  );
}

