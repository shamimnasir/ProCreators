const { MongoClient } = require('mongodb');

async function main() {
  const url = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME || 'procreators';
  
  const client = await MongoClient.connect(url);
  const db = client.db(dbName);
  const menus = db.collection('site_menus');  // Use the correct collection!
  
  // Update footer_product
  await menus.updateOne(
    { menuId: 'footer_product' },
    { 
      $set: { 
        name: 'Product',
        location: 'footer',
        column: 1,
        items: [
          { id: 'fp1', label: 'All Tools', link: '/tools', type: 'page', order: 1 },
          { id: 'fp2', label: 'Pricing', link: '/pricing', type: 'page', order: 2 },
          { id: 'fp3', label: 'Dashboard', link: '/dashboard', type: 'page', order: 3 },
          { id: 'fp4', label: 'Roadmap', link: '/roadmap', type: 'page', order: 4 }
        ]
      }
    },
    { upsert: true }
  );
  console.log('Updated footer_product');
  
  // Update footer_solutions
  await menus.updateOne(
    { menuId: 'footer_solutions' },
    { 
      $set: { 
        name: 'Solutions',
        location: 'footer',
        column: 2,
        items: [
          { id: 'fs1', label: 'Content Creators', link: '/tools?category=video', type: 'page', order: 1 },
          { id: 'fs2', label: 'Marketing Teams', link: '/tools?category=business', type: 'page', order: 2 },
          { id: 'fs3', label: 'Agencies', link: '/tools?category=business', type: 'page', order: 3 },
          { id: 'fs4', label: 'Educators', link: '/tools?category=education', type: 'page', order: 4 }
        ]
      }
    },
    { upsert: true }
  );
  console.log('Updated footer_solutions');
  
  // Update footer_resources - REMOVE Community, rename Help Center to Documentation
  await menus.updateOne(
    { menuId: 'footer_resources' },
    { 
      $set: { 
        name: 'Resources',
        location: 'footer',
        column: 3,
        items: [
          { id: 'fr1', label: 'Documentation', link: '/docs', type: 'page', order: 1 },
          { id: 'fr2', label: 'Blog', link: '/blog', type: 'page', order: 2 },
          { id: 'fr3', label: 'FAQ', link: '/faq', type: 'page', order: 3 },
          { id: 'fr4', label: 'Status', link: '/status', type: 'page', order: 4 }
        ]
      }
    },
    { upsert: true }
  );
  console.log('Updated footer_resources');
  
  // Update footer_bottom legal items
  await menus.updateOne(
    { menuId: 'footer_bottom', location: 'footer_bottom' },
    { 
      $set: { 
        name: 'Legal',
        location: 'footer_bottom',
        items: [
          { id: 'fl1', label: 'Privacy Policy', link: '/privacy', type: 'page', order: 1 },
          { id: 'fl2', label: 'Terms of Service', link: '/terms', type: 'page', order: 2 },
          { id: 'fl3', label: 'Cookie Policy', link: '/cookies', type: 'page', order: 3 }
        ]
      }
    },
    { upsert: true }
  );
  console.log('Updated footer_bottom');
  
  console.log('All footer menus updated successfully!');
  await client.close();
}

main().catch(console.error);
