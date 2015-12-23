import 'babel-core/register'
import path from 'path'
import Roots from '..'

const fixtures = path.join(__dirname, 'fixtures')

export default {
  compileFixture: (t, name) => {
    let testPath = path.join(fixtures, name)
    let project = new Roots({ root: testPath })
    let publicPath = path.join(testPath, 'public')

    return project.compile().then((res) => {
      return { res: res, publicPath: publicPath }
    })
  }
}
