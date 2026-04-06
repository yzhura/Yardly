const thBase =
  "py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

const columns = [
  { label: "Користувач", className: `px-6 ${thBase}` },
  { label: "Роль", className: `px-4 ${thBase}` },
  { label: "Статус", className: `px-4 ${thBase}` },
  { label: "Дата додавання", className: `px-4 ${thBase}` },
  { label: "Дії", className: `px-6 text-right ${thBase}` },
] as const;

/** Shared column headers for the team members table (real table + loading skeleton). */
export function TeamMembersTableHeadRow() {
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
