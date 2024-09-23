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
    <button className={`flex items-center justify-center rounded-lg bg-[#fff] 
      lg:h-20 lg:w-20 lg:border-8 
      md:h-14 md:w-14 md:border-[6px] 
      sm:h-12 sm:w-12 sm:border-4 
      h-10 w-10 border-[3px]
      ${borderStyle}`}
    onClick={onClick}>
      <Chip color={colorId[chipId]} />
    </button>
  )
}


