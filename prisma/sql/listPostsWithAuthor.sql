SELECT
    p.id,
    p.title,
    p.content,
    u.id as "authorId",
    u.name as "authorName"
FROM "Post" as p
    INNER JOIN "User" as u ON u.id = p."authorId"
WHERE u.id = $1;