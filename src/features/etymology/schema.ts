// Dexie carries the unchanged v3 tables forward automatically.
export const etymologySchema = {
  etymologyEntries: 'id,&normalizedWord,wordId,verificationStatus',
  roots: 'id,root,language,verificationStatus',
  rootWordRelations: 'id,rootId,wordId,normalizedWord,[rootId+normalizedWord]',
  rootFavorites: 'rootId,createdAt',
  rootLearningStates: 'rootId,status,lastViewedAt',
  rootLearningEvents: '++id,rootId,word,viewedAt',
  etymologyViews: 'normalizedWord,lastViewedAt',
  etymologySettings: 'key',
  etymologyPackages: 'id,importedAt',
}
