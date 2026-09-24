import { DISTRICTS } from '../config/districts.js';
export function DistrictSelect({name='district',value='',required=true,onChange}){
  return <select name={name} defaultValue={value} required={required} onChange={onChange}><option value="">Tumanni tanlang</option>{DISTRICTS.map(area=><option key={area}>{area}</option>)}</select>;
}
export function CategorySelect({categories,name='category_id',value='',required=true,onChange}){
  return <select name={name} defaultValue={value} required={required} onChange={onChange}><option value="">Xizmat turini tanlang</option>{categories.map(category=><option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}</select>;
}
