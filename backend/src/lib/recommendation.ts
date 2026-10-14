export function scoreStudentMatch(currentUser: any, candidate: any) {
  const candidateSkills = new Set((candidate.skills ?? []).map((item: string) => item.toLowerCase()))
  const candidateInterests = new Set((candidate.interests ?? []).map((item: string) => item.toLowerCase()))
  const currentSkills = new Set((currentUser.skills ?? []).map((item: string) => item.toLowerCase()))
  const currentInterests = new Set((currentUser.interests ?? []).map((item: string) => item.toLowerCase()))

  const sharedSkills = [...candidateSkills].filter((skill) => currentSkills.has(skill)).length
  const sharedInterests = [...candidateInterests].filter((interest) => currentInterests.has(interest)).length
  const sharedRoles = (candidate.preferredRoles ?? []).filter((role: string) => (currentUser.preferredRoles ?? []).includes(role)).length

  const score = sharedSkills * 4 + sharedInterests * 3 + sharedRoles * 2 + (candidate.collegeName && candidate.collegeName === currentUser.collegeName ? 1 : 0)

  const reasons: string[] = []
  if (sharedSkills > 0) reasons.push(`You both work with ${[...candidateSkills].filter((skill) => currentSkills.has(skill)).slice(0, 2).join(' and ')}.`)
  if (sharedInterests > 0) reasons.push(`You share interest in ${[...candidateInterests].filter((interest) => currentInterests.has(interest)).slice(0, 2).join(' and ')}.`)
  if (sharedRoles > 0) reasons.push(`Your preferred roles align on ${sharedRoles} role match.`)
  if (reasons.length === 0) reasons.push('You share a collaborative, growth-oriented profile.')

  return {
    score,
    reasons: reasons.slice(0, 2),
  }
}
