from inspect import isawaitable


async def session_exec(session, query):
    result = session.exec(query)
    if isawaitable(result):
        result = await result
    return result


async def session_commit(session):
    result = session.commit()
    if isawaitable(result):
        await result


async def session_refresh(session, obj):
    result = session.refresh(obj)
    if isawaitable(result):
        await result


async def session_delete(session, obj):
    result = session.delete(obj)
    if isawaitable(result):
        await result

