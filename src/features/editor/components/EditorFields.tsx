/**
 * Form controls shared by the editor panel and the collider editor modal:
 * labeled number/vector inputs and the collider section.
 * @module features/editor/components/EditorFields
 */

import type { ReactNode } from 'react'
import { FiEdit3 } from 'react-icons/fi'
import type { Vector3Tuple } from 'three'
import type { ColliderSpec, EditableEntity } from '@/engine/types'
import { defaultColliderForType, DEFAULT_BOX_SIZE, DEFAULT_CYLINDER_HEIGHT, DEFAULT_CYLINDER_RADIUS } from '@/engine/colliders'

/** Shape choices of the collider section; `default` drops the override so the type's default applies. */
const COLLIDER_SHAPES: Array<{ value: 'default' | ColliderSpec['shape']; label: string }> = [
  { value: 'default', label: 'Por tipo' },
  { value: 'box', label: 'Caja' },
  { value: 'cylinder', label: 'Cilindro' },
  { value: 'none', label: 'Ninguna' },
]

/** Shared class of the panel's text and number inputs. */
export const INPUT_CLASS = 'w-full min-w-0 rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none focus:bg-white/15'

/**
 * Props for {@link FieldLabel}.
 */
interface FieldLabelProps {
  /** Caption above the control. */
  label: string
  /** The control itself. */
  children: ReactNode
  /** Extra classes for the wrapper. */
  className?: string
}

/**
 * @param props - Caption and control
 * @returns Labeled field
 */
export function FieldLabel({ label, children, className = '' }: FieldLabelProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="truncate text-[10px] uppercase tracking-widest text-parchment/50">{label}</span>
      {children}
    </label>
  )
}

/**
 * Props for {@link NumberField}.
 */
interface NumberFieldProps {
  /** Caption above the input. */
  label: string
  /** Current value. */
  value: number
  /** Input step. */
  step?: number
  /** Value used when the input is cleared or invalid. */
  fallback?: number
  /** Called with the parsed value. */
  onChange: (value: number) => void
}

/**
 * @param props - Caption, value and change handler
 * @returns Labeled number input
 */
export function NumberField({ label, value, step = 0.1, fallback = 0, onChange }: NumberFieldProps) {
  return (
    <FieldLabel label={label}>
      <input
        type="number"
        step={step}
        value={Number(value.toFixed(3))}
        onChange={(ev) => {
          const parsed = parseFloat(ev.target.value)
          onChange(Number.isFinite(parsed) ? parsed : fallback)
        }}
        className={INPUT_CLASS}
      />
    </FieldLabel>
  )
}

/**
 * Props for {@link Vector3Fields}.
 */
interface Vector3FieldsProps {
  /** Captions of the three components. */
  labels: [string, string, string]
  /** Current vector. */
  value: Vector3Tuple
  /** Input step. */
  step?: number
  /** Called with the whole updated vector. */
  onChange: (value: Vector3Tuple) => void
}

/**
 * @param props - Captions, vector and change handler
 * @returns Three number inputs in a row
 */
export function Vector3Fields({ labels, value, step, onChange }: Vector3FieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {labels.map((label, idx) => (
        <NumberField
          key={label}
          label={label}
          step={step}
          value={value[idx]}
          onChange={(v) => {
            const next: Vector3Tuple = [...value]
            next[idx] = v
            onChange(next)
          }}
        />
      ))}
    </div>
  )
}

/**
 * Props for {@link ColliderSection}.
 */
interface ColliderSectionProps {
  /** Entity whose collider is edited. */
  entity: EditableEntity
  /** Entity updater. */
  onUpdate: (id: string, patch: Partial<EditableEntity>) => void
  /** Opens the visual collider editor; the button is hidden when omitted. */
  onOpenEditor?: () => void
}

/**
 * Editor for an entity's collider: shape, offset, size or radius/height, and
 * activation tag. Editing a type default copies it into the entity first, so
 * the override is exported with the entity.
 * @param props - Entity and updater
 * @returns Collider section
 */
export function ColliderSection({ entity, onUpdate, onOpenEditor }: ColliderSectionProps) {
  const typeDefault = defaultColliderForType(entity.type)
  const effective = entity.collider ?? typeDefault
  const activeShape = entity.collider ? entity.collider.shape : 'default'
  const source = entity.collider ? 'propia' : typeDefault ? 'por tipo' : 'sin colisión'

  /**
   * @param patch - Fields merged onto the effective collider, saved as the entity's override
   */
  const patchCollider = (patch: Partial<ColliderSpec>) => {
    const base: ColliderSpec = effective ?? { shape: 'box' }
    onUpdate(entity.id, { collider: { ...base, ...patch } })
  }

  /**
   * @param shape - Chosen shape, or `default` to fall back to the type's collider
   */
  const selectShape = (shape: 'default' | ColliderSpec['shape']) => {
    if (shape === 'default') {
      onUpdate(entity.id, { collider: undefined })
      return
    }
    if (shape === 'none') {
      onUpdate(entity.id, { collider: { shape: 'none' } })
      return
    }
    const base = effective && effective.shape !== 'none' ? effective : undefined
    if (shape === 'box') {
      onUpdate(entity.id, { collider: { shape, offset: base?.offset, size: base?.size ?? [...DEFAULT_BOX_SIZE], tag: base?.tag } })
      return
    }
    onUpdate(entity.id, {
      collider: { shape, offset: base?.offset, radius: base?.radius ?? DEFAULT_CYLINDER_RADIUS, height: base?.height ?? DEFAULT_CYLINDER_HEIGHT, tag: base?.tag },
    })
  }

  const shown = effective && effective.shape !== 'none' ? effective : undefined

  return (
    <div className="mt-3 rounded-md border border-[#39d0ff]/20 bg-[#39d0ff]/5 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7fe0ff]">Colisión</span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-parchment/40">{source}</span>
        {onOpenEditor && (
          <button
            type="button"
            onClick={onOpenEditor}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-[#39d0ff]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7fe0ff] hover:bg-[#39d0ff]/25"
          >
            <FiEdit3 className="h-3 w-3" /> Editar colisión
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {COLLIDER_SHAPES.map((shape) => (
          <button
            key={shape.value}
            type="button"
            disabled={shape.value === 'default' && !typeDefault}
            onClick={() => selectShape(shape.value)}
            className={`cursor-pointer truncate rounded-md px-1 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-30 ${
              activeShape === shape.value ? 'bg-[#39d0ff] text-[#04121a]' : 'bg-white/10 text-parchment/70 hover:bg-white/15'
            }`}
          >
            {shape.label}
          </button>
        ))}
      </div>
      {shown && (
        <>
          <div className="mt-2">
            <Vector3Fields labels={['Offset X', 'Offset Y', 'Offset Z']} value={shown.offset ?? [0, 0, 0]} onChange={(offset) => patchCollider({ offset })} />
          </div>
          {shown.shape === 'box' ? (
            <div className="mt-2">
              <Vector3Fields labels={['Ancho X', 'Alto Y', 'Fondo Z']} value={shown.size ?? DEFAULT_BOX_SIZE} onChange={(size) => patchCollider({ size: size.map((v) => Math.max(0.01, v)) as Vector3Tuple })} />
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <NumberField label="Radio" value={shown.radius ?? DEFAULT_CYLINDER_RADIUS} fallback={DEFAULT_CYLINDER_RADIUS} onChange={(radius) => patchCollider({ radius: Math.max(0.01, radius) })} />
              <NumberField label="Altura" value={shown.height ?? DEFAULT_CYLINDER_HEIGHT} fallback={DEFAULT_CYLINDER_HEIGHT} onChange={(height) => patchCollider({ height: Math.max(0.01, height) })} />
            </div>
          )}
          <FieldLabel label="Etiqueta (opcional)" className="mt-2">
            <input
              type="text"
              placeholder="ej. ruined, restored"
              value={shown.tag ?? ''}
              onChange={(ev) => patchCollider({ tag: ev.target.value || undefined })}
              className={INPUT_CLASS}
            />
          </FieldLabel>
          <div className="mt-1.5 text-[10px] leading-4 text-parchment/40">
            Se escala y rota con el elemento. Una caja rotada colisiona como su caja alineada a los ejes.
          </div>
        </>
      )}
    </div>
  )
}
