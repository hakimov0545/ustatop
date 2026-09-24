export const money=value=>Number(value||0).toLocaleString('uz-UZ');
export const dateTime=value=>value?new Date(value).toLocaleString('uz-UZ',{dateStyle:'medium',timeStyle:'short'}):'Vaqt kelishiladi';
