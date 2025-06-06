-- Update the number of messages in each chat:
UPDATE chats
SET message_count = (
    SELECT COUNT(cm.id)
    FROM chat_messages cm
    WHERE cm.chat_id = chats.id
);

-- Total number of chats
select count(*) from chats where ignore=false and mode<>'tuning' and config_id='default' and message_count > 1;

-- Chats by user
select user_name, count(id) chat_count, avg(rating) as avg_rating
from chats
where ignore=false and mode<>'tuning' and config_id='default' and message_count > 1
group by user_name
order by user_name;

-- Number of chats by number of messages
SELECT
    COUNT(*) as chat_count,
    message_count
FROM (
    SELECT
        c.id,
        COUNT(cm.id) as message_count
    FROM chats c
    LEFT JOIN chat_messages cm ON c.id = cm.chat_id
    where c.ignore=false and c.mode<>'tuning' and c.config_id='default' and c.message_count > 1
    GROUP BY c.id
) chat_message_counts
GROUP BY message_count
ORDER BY message_count;

-- Duration of chat
SELECT
    c.user_name,
    ROUND(EXTRACT(EPOCH FROM (MAX(cm.created_at) - MIN(cm.created_at)))/60, 2) as duration_minutes
FROM chats c
INNER JOIN chat_messages cm ON c.id = cm.chat_id
GROUP BY c.id, c.user_name
ORDER BY duration_minutes;

-- Number of messages with feedback
select count(*), feedback
from chat_messages
where feedback is not null
group by feedback
order by feedback;

-- Chat feedback
select user_name, feedback from chats where feedback is not null and feedback <>'' order by feedback;
