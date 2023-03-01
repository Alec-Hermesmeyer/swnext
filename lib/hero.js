export const getHeroData = async () => {
    const res = await fetch('/api/heroData')
    const heroData = await res.json()
    return heroData
  }