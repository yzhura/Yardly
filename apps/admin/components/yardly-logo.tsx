"use client";

export function YardlyLogo() {
  return (
    <h1 className="m-0 border-0 p-0">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="cursor-pointer rounded-sm bg-transparent p-0 text-left font-extrabold tracking-[-1px] text-[#0f172a] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "26px",
          fontWeight: 800,
        }}
        aria-label="Yardly — перезавантажити сторінку"
      >
        Yard<span className="text-[#94a3b8]">ly</span>
      </button>
    </h1>
  );
}
