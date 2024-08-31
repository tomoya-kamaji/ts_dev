SELECT
    u.id as authorId,
    u.name as authorName
FROM
    User as u
WHERE
    u.id = ?;