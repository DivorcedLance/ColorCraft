export function Chip({ color }: { color: string | null }) {

  const bgStyle = color ? `bg-[${color}]` : 'bg-[#fff]'

  return (
    <div className={`h-12 w-12 rounded-full ${bgStyle}`}></div>
  )

}

