import { query } from './src/config/database.js';
const { rows } = await query("SELECT id, nome, ad_name, veiculo, cloudinary_url FROM creatives WHERE nome ILIKE '%gas%' OR ad_name ILIKE '%gas%'");
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
