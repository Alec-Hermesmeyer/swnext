export const getGridData = async () => {
    const res = await fetch('/api/gridData')
    const data = await res.json()
    return data
  }