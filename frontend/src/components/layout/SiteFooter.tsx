export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-900 py-10 text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <span className="text-lg font-extrabold text-white">H2O Floss</span>
        <p className="max-w-md text-sm leading-7">
          تقنية ضخ المياه المبتكرة لتنظيف عميق ولثة صحية. صُمم لراحتك في كل مكان.
        </p>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} H2O Floss — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  )
}
