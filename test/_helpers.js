import 'babel-core/register'
import path from 'path'
import Roots from '..'

const fixtures = path.join(__dirname, 'fixtures')

export default {
  compileFixture: (t, name) => {
    let testPath = t.context.testPath = path.join(fixtures, name)
    let project = t.context.project = new Roots({ root: testPath })
    t.context.publicPath = path.join(testPath, 'public')

    return project.compile()
  }
}
