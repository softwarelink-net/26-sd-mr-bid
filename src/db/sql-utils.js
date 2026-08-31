/** 去掉 -- 行注释后执行 schema（支持多语句） */
export function stripLineComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
}

export function execSchema(db, sql) {
  db.exec(stripLineComments(sql))
}
