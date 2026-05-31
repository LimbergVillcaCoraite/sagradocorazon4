import inspect


async def session_exec(session, query):
    """Execute a query on sync or async SQLModel sessions."""
    exec_fn = session.exec
    if inspect.iscoroutinefunction(exec_fn):
        return await exec_fn(query)
    return exec_fn(query)


async def session_commit(session):
    """Commit the session on sync or async SQLModel sessions."""
    commit_fn = session.commit
    if inspect.iscoroutinefunction(commit_fn):
        return await commit_fn()
    return commit_fn()


async def session_refresh(session, obj):
    """Refresh an object on sync or async SQLModel sessions."""
    refresh_fn = session.refresh
    if inspect.iscoroutinefunction(refresh_fn):
        return await refresh_fn(obj)
    return refresh_fn(obj)


async def session_delete(session, obj):
    """Delete an object on sync or async SQLModel sessions."""
    delete_fn = session.delete
    if inspect.iscoroutinefunction(delete_fn):
        return await delete_fn(obj)
    return delete_fn(obj)
