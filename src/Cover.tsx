function Cover() {
  return (
    <main className="cover" aria-label="Bug Receipt cover">
      <div className="cover__background" aria-hidden="true" />
      <div className="cover__veil" aria-hidden="true" />
      <div className="cover__content">
        <div className="cover__brand">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M11 7h26v34l-4-3-4 3-5-3-5 3-4-3-4 3V7Z" />
            <path className="cover__check" d="m17 23 5 5 10-11" />
          </svg>
          <span>Bug Receipt</span>
        </div>
        <div className="cover__copy">
          <p>Portable agent skill</p>
          <h1>No <em>“fixed”</em><br />without receipts.</h1>
          <h2>Evidence before confidence.</h2>
        </div>
        <div className="cover__footer"><span>Reproduce</span><i /><span>Root cause</span><i /><span>Verify</span><b>v1.0</b></div>
      </div>
    </main>
  )
}

export default Cover
