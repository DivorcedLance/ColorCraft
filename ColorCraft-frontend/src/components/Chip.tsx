export function Chip({ color }: { color: string | null }) {

  const bgStyle = color ? `bg-[${color}]` : 'bg-[#fff]'

  return (
    <div className={`h-4/6 w-4/6 rounded-full ${bgStyle}`}></div>
  )

}

