/** Architectural line drawings per property type — shown on hover in the listing index. */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round', strokeLinejoin: 'round' };
export default function PropertyArt({ type, className }) {
  const draw = {
    apartment: (<g {...S}><path d="M40 112V26h70v86M30 112h120" /><path d="M110 112V50h30v62" />{[38, 54, 70, 86].map((y) => <path key={y} d={`M50 ${y}h12v9H50zM68 ${y}h12v9H68zM86 ${y}h12v9H86z`} />)}<path d="M66 112v-14h18v14" /><path d="M118 62h14v8h-14zM118 80h14v8h-14z" /></g>),
    garden: (<g {...S}><path d="M30 112h120M38 112V70h84v42" /><path d="M48 112V86h30v26M86 82h28v16H86z" /><path d="M38 70h84" /><path d="M128 112c0-14 6-22 12-22s6 10 2 22" /><circle cx="140" cy="84" r="10" /><path d="M20 112c4-8 10-10 14-6" /></g>),
    duplex: (<g {...S}><path d="M30 112h120M44 112V40h92v72" /><path d="M44 76h92" /><path d="M56 52h30v16H56zM96 52h28v16H96zM56 88h20v24M96 88h28v14H96z" /><path d="M40 40h100" /></g>),
    unit: (<g {...S}><path d="M24 112h132M36 112V58l36-24 36 24v54" /><path d="M108 112V80h36v32" /><path d="M116 92h14v10h-14z" /><path d="M58 112V84h28v28" /><path d="M52 64h12v10H52zM80 64h12v10H80z" /></g>),
    shop: (<g {...S}><path d="M24 112h132M36 112V50h108v62" /><path d="M36 50l8-16h92l8 16" /><path d="M48 112V70h40v42M98 70h34v26H98z" /><path d="M36 50c0 6 6 8 12 8s12-2 12-8c0 6 6 8 12 8s12-2 12-8c0 6 6 8 12 8s12-2 12-8c0 6 6 8 12 8s12-2 12-8" /></g>),
    office: (<g {...S}><path d="M24 112h132M52 112V22h76v90" />{[32, 46, 60, 74, 88].map((y) => <path key={y} d={`M60 ${y}h60M60 ${y + 8}h60`} />)}<path d="M80 112v-12h20v12" /></g>),
    industrial: (<g {...S}><path d="M20 112h140M30 112V66l26 14V66l26 14V66l26 14V50h40v62" /><path d="M44 112V94h22v18M112 92h22v12h-22z" /><path d="M148 50V30h-8v20" /></g>),
  };
  return (<svg viewBox="0 0 180 130" className={className} role="img" aria-label="">{draw[type] || draw.apartment}</svg>);
}
