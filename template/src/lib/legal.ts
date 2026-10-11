import type { LegalProfile } from 'sitewright-core'
import type { SiteModule } from './modules'

/**
 * What the legal pages need to know about this site, read from its own module manifest.
 *
 * It is read here, at runtime, rather than written by the generator: the manifest and the
 * contact form's collection are what is really deployed, including whatever was edited by
 * hand in this site, and a description copied out of the blueprint would drift from them.
 */
export function legalProfile(modules: SiteModule[]): LegalProfile {
  const form = modules.find((m) => m.id === 'contact')?.collection
  return {
    modules: modules.map((m) => m.id),
    formFields: form ? form.fields.flatMap((field) => ('name' in field ? [field.name] : [])) : [],
  }
}
