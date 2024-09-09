import { Chip } from './Chip'

const colorId: { [key: number]: string | null } = {
  0: '#FFFFFF',
  1: '#EA676C',
  2: '#0094BC',
  3: '#F83313',
  4: '#8BC240',
  5: '#F3E896',
  6: '#522494',
  7: '#FC6C2D'
}

export function Box({ chipId, onClick, borderId } : { chipId: number, onClick: () => void, borderId: number }) {

  const borderStyle = `border-[${colorId[borderId]}]`

  return (
    <button className={`flex items-center justify-center h-20 w-20 rounded-lg bg-[#fff] border-8 ${borderStyle}`}
    onClick={onClick}>
      <Chip color={colorId[chipId]} />
    </button>
  )
}


