/**
 * Tests for the bid-assistant dirty-tracking machinery:
 *   - isFieldDirty utility
 *   - useBidAssistantReducer SET_DRAFT / UPDATE_DRAFT_FIELD / APPLY_CHAT_SUGGESTION
 *
 * These cover the per-section "Modified" / "AI edit" badges in
 * BidDocumentEditor, which are derived from (draft, savedDraft, draftHistory).
 */

import { renderHook, act } from '@testing-library/react'
import { useBidAssistantReducer } from '@/components/admin/bid-assistant/useBidAssistantReducer'
import { isFieldDirty, normalizeDraftPayload } from '@/components/admin/bid-assistant/bid-assistant-utils'

describe('isFieldDirty', () => {
  it('returns false when string fields match', () => {
    const a = { intro: 'hello' }
    const b = { intro: 'hello' }
    expect(isFieldDirty(a, b, 'intro')).toBe(false)
  })

  it('returns true when string fields differ', () => {
    const a = { intro: 'hello world' }
    const b = { intro: 'hello' }
    expect(isFieldDirty(a, b, 'intro')).toBe(true)
  })

  it('treats null and "" as equal for primitive fields', () => {
    const a = { intro: '' }
    const b = { intro: null }
    expect(isFieldDirty(a, b, 'intro')).toBe(false)
  })

  it('returns false for arrays with same items in same order', () => {
    const a = { scope_items: ['a', 'b', 'c'] }
    const b = { scope_items: ['a', 'b', 'c'] }
    expect(isFieldDirty(a, b, 'scope_items')).toBe(false)
  })

  it('returns true when array contents differ', () => {
    const a = { scope_items: ['a', 'b', 'c'] }
    const b = { scope_items: ['a', 'b'] }
    expect(isFieldDirty(a, b, 'scope_items')).toBe(true)
  })

  it('returns true when array order differs (reordering counts as a change)', () => {
    const a = { scope_items: ['a', 'b', 'c'] }
    const b = { scope_items: ['c', 'b', 'a'] }
    expect(isFieldDirty(a, b, 'scope_items')).toBe(true)
  })

  it('returns true when pricing rows differ', () => {
    const a = { pricing_items: [{ label: 'Mob', amount: '$5,000' }] }
    const b = { pricing_items: [{ label: 'Mob', amount: '$6,000' }] }
    expect(isFieldDirty(a, b, 'pricing_items')).toBe(true)
  })

  it('handles missing draft objects gracefully', () => {
    expect(isFieldDirty(undefined, { intro: 'x' }, 'intro')).toBe(true)
    expect(isFieldDirty({ intro: 'x' }, undefined, 'intro')).toBe(true)
    expect(isFieldDirty(undefined, undefined, 'intro')).toBe(false)
  })
})

describe('useBidAssistantReducer — dirty-tracking', () => {
  it('initial draft and savedDraft are equal (no fields dirty)', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    const { draft, savedDraft } = result.current.state
    expect(JSON.stringify(draft)).toBe(JSON.stringify(savedDraft))
    expect(isFieldDirty(draft, savedDraft, 'intro')).toBe(false)
    expect(isFieldDirty(draft, savedDraft, 'scope_items')).toBe(false)
  })

  it('SET_DRAFT updates both draft and savedDraft so nothing is dirty after a load', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({
        intro: 'Loaded intro',
        scope_items: ['Item 1', 'Item 2'],
      })
    })
    const { draft, savedDraft } = result.current.state
    expect(draft.intro).toBe('Loaded intro')
    expect(savedDraft.intro).toBe('Loaded intro')
    expect(isFieldDirty(draft, savedDraft, 'intro')).toBe(false)
    expect(isFieldDirty(draft, savedDraft, 'scope_items')).toBe(false)
  })

  it('UPDATE_DRAFT_FIELD makes that field dirty without touching savedDraft', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({ intro: 'Original' })
    })
    act(() => {
      result.current.actions.updateDraftField('intro', 'Edited by user')
    })
    const { draft, savedDraft } = result.current.state
    expect(draft.intro).toBe('Edited by user')
    expect(savedDraft.intro).toBe('Original')
    expect(isFieldDirty(draft, savedDraft, 'intro')).toBe(true)
    expect(isFieldDirty(draft, savedDraft, 'terms')).toBe(false)
  })

  it('APPLY_CHAT_SUGGESTION marks field dirty AND records draftHistory with source', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({ intro: 'Original' })
    })
    act(() => {
      result.current.actions.applyChatSuggestion({
        field: 'intro',
        value: 'AI-generated intro',
        source: 'ai_assist',
      })
    })
    const { draft, savedDraft, draftHistory } = result.current.state
    expect(draft.intro).toBe('AI-generated intro')
    expect(savedDraft.intro).toBe('Original')
    expect(isFieldDirty(draft, savedDraft, 'intro')).toBe(true)
    expect(draftHistory).toHaveLength(1)
    expect(draftHistory[0]).toMatchObject({
      field: 'intro',
      previous: 'Original',
      source: 'ai_assist',
    })
  })

  it('a second SET_DRAFT (post-save) clears dirty state', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({ intro: 'Original' })
    })
    act(() => {
      result.current.actions.updateDraftField('intro', 'Edited')
    })
    expect(
      isFieldDirty(result.current.state.draft, result.current.state.savedDraft, 'intro'),
    ).toBe(true)
    // simulate server echo after a successful save
    act(() => {
      result.current.actions.setDraft({ intro: 'Edited' })
    })
    const { draft, savedDraft } = result.current.state
    expect(isFieldDirty(draft, savedDraft, 'intro')).toBe(false)
  })

  it('SET_DRAFT short-circuits when payload already matches both draft and savedDraft', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({ intro: 'Same' })
    })
    const stateAfterFirst = result.current.state
    act(() => {
      // Identical payload — reducer should return the same state object.
      result.current.actions.setDraft({ intro: 'Same' })
    })
    expect(result.current.state).toBe(stateAfterFirst)
  })

  it('CLEAR_SELECTION resets draft, savedDraft, and draftHistory', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({ intro: 'Loaded' })
    })
    act(() => {
      result.current.actions.applyChatSuggestion({
        field: 'intro',
        value: 'AI',
        source: 'ai_assist',
      })
    })
    expect(result.current.state.draftHistory.length).toBeGreaterThan(0)
    act(() => {
      result.current.actions.clearSelection()
    })
    const empty = normalizeDraftPayload({})
    expect(result.current.state.draft).toEqual(empty)
    expect(result.current.state.savedDraft).toEqual(empty)
    expect(result.current.state.draftHistory).toEqual([])
  })

  it('REVERT_SECTION restores the previous value but does not touch savedDraft', () => {
    const { result } = renderHook(() => useBidAssistantReducer())
    act(() => {
      result.current.actions.setDraft({ intro: 'Original' })
    })
    act(() => {
      result.current.actions.applyChatSuggestion({
        field: 'intro',
        value: 'AI version',
        source: 'ai_assist',
      })
    })
    expect(result.current.state.draft.intro).toBe('AI version')
    act(() => {
      result.current.actions.revertSection('intro')
    })
    expect(result.current.state.draft.intro).toBe('Original')
    expect(result.current.state.savedDraft.intro).toBe('Original')
    // After revert, draft matches savedDraft again — not dirty.
    expect(
      isFieldDirty(result.current.state.draft, result.current.state.savedDraft, 'intro'),
    ).toBe(false)
  })
})
