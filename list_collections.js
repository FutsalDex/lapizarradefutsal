import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function listCollectionsAndFields() {
  const collections = await db.listCollections();
  console.log(`📋 Colecciones encontradas: ${collections.length}\n`);

  for (const col of collections) {
    console.log(`📁 Colección: ${col.id}`);

    const snapshot = await col.limit(1).get();
    if (snapshot.empty) {
      console.log("   ⚠️  (Vacía)\n");
      continue;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const campos = Object.keys(data);
      console.log("   Campos:", campos.join(", "));
      console.log();
    });
  }
}

listCollectionsAndFields().catch(console.error);
