import type { TimeOfDay } from './timeOfDay'
import { BeanSpectators } from './world/BeanSpectators'
import { Billboards } from './world/Billboards'
import { Buildings } from './world/Buildings'
import { OverheadSigns } from './world/OverheadSigns'
import { Road } from './world/Road'
import { Roadside } from './world/Roadside'
import { Sky } from './world/Sky'

export function Track({ mode }: { mode: TimeOfDay }) {
  return (
    <group>
      <Sky mode={mode} />
      <Road />
      <Roadside />
      <Billboards />
      <OverheadSigns />
      <BeanSpectators />
      <Buildings mode={mode} />
    </group>
  )
}
