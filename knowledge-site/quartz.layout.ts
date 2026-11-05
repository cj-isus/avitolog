import { PageLayout, SharedLayout } from "./quartz/cfg"
import type { QuartzComponentProps } from "./quartz/components/types"
import * as Component from "./quartz/components"
import KnowledgeHome from "./quartz/components/KnowledgeHome"
import SourceLink from "./quartz/components/SourceLink"

const isHome = (page: QuartzComponentProps) => page.fileData.slug === "index"
const graphOptions = {
  localGraph: { depth: 1 },
  globalGraph: { depth: -1 },
}
const navigation = [
  Component.PageTitle(),
  Component.MobileOnly(Component.Spacer()),
  Component.Flex({ components: [
    { Component: Component.Search(), grow: true },
    { Component: Component.Darkmode() },
    { Component: Component.ReaderMode() },
  ] }),
  Component.Explorer({
    title: "База знаний", folderDefaultState: "collapsed", folderClickBehavior: "link", useSavedState: true,
    mapFn: node => {
      const labels: Record<string, string> = { capabilities: "Возможности", categories: "Направления", projects: "Проекты", research: "Исследования", notes: "Заметки", methodology: "Метод и лицензии", reconciliation: "Сверка исследования", reuse: "Переиспользование" }
      if (node.isFolder && labels[node.slugSegment]) node.displayName = labels[node.slugSegment]
    },
  }),
]

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(), header: [], afterBody: [],
  footer: Component.Footer({ links: { "Исходники базы": "https://github.com/cj-isus/avitolog/tree/main/research", "Quartz · MIT": "https://github.com/jackyzha0/quartz" } }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({ component: Component.Breadcrumbs(), condition: page => !isHome(page) }),
    Component.ArticleTitle(),
    Component.ConditionalRender({ component: SourceLink(), condition: page => !isHome(page) }),
    Component.ConditionalRender({ component: KnowledgeHome(), condition: isHome }),
  ],
  left: navigation,
  right: [
    Component.ConditionalRender({ component: Component.Graph(graphOptions), condition: page => !isHome(page) }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.ConditionalRender({ component: Component.Backlinks(), condition: page => !isHome(page) }),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle()],
  left: navigation,
  right: [],
}
