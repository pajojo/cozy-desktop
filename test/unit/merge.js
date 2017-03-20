/* eslint-env mocha */

import async from 'async'
import clone from 'lodash.clone'
import sinon from 'sinon'
import should from 'should'

import Merge from '../../src/merge'

import configHelpers from '../helpers/config'
import pouchHelpers from '../helpers/pouch'

describe('Merge', function () {
  before('instanciate config', configHelpers.createConfig)
  before('instanciate pouch', pouchHelpers.createDatabase)
  beforeEach('instanciate merge', function () {
    this.side = 'local'
    this.merge = new Merge(this.pouch)
  })
  after('clean pouch', pouchHelpers.cleanDatabase)
  after('clean config directory', configHelpers.cleanConfig)

  describe('addFile', function () {
    it('saves the new file', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'foo/new-file',
        path: 'foo/new-file',
        checksum: 'adc83b19e793491b1c6ea0fd8b46cd9f32e592fc',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      this.merge.addFile(this.side, doc, err => {
        should.not.exist(err)
        this.pouch.db.get(doc._id, function (err, res) {
          should.not.exist(err)
          for (let date of ['creationDate', 'lastModification']) {
            doc[date] = doc[date].toISOString()
          }
          res.should.have.properties(doc)
          res.sides.local.should.equal(1)
          done()
        })
      })
    })

    describe('when a file with the same path exists', function () {
      before('create a file', function (done) {
        this.file = {
          _id: 'BUZZ.JPG',
          path: 'BUZZ.JPG',
          docType: 'file',
          checksum: '1111111111111111111111111111111111111111',
          creationDate: new Date(),
          lastModification: new Date(),
          tags: ['foo'],
          size: 12345,
          class: 'image',
          mime: 'image/jpeg'
        }
        this.pouch.db.put(this.file, done)
      })

      it('can update the metadata', function (done) {
        this.merge.ensureParentExist = sinon.stub().yields(null)
        let was = clone(this.file)
        this.file.tags = ['bar', 'baz']
        this.file.lastModification = new Date()
        let doc = clone(this.file)
        delete doc.size
        delete doc.class
        delete doc.mime
        this.file.creationDate = doc.creationDate.toISOString()
        this.file.lastModification = doc.lastModification.toISOString()
        this.merge.addFile(this.side, doc, err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, (err, res) => {
            should.not.exist(err)
            res.should.have.properties(this.file)
            res.size.should.equal(was.size)
            res.class.should.equal(was.class)
            res.mime.should.equal(was.mime)
            res.sides.local.should.equal(2)
            done()
          })
        })
      })
    })
  })

  describe('updateFile', function () {
    it('saves the new file', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOOBAR/NEW-FILE',
        path: 'FOOBAR/NEW-FILE',
        checksum: 'adc83b19e793491b1c6ea0fd8b46cd9f32e592fc',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      this.merge.updateFile(this.side, doc, err => {
        should.not.exist(err)
        this.pouch.db.get(doc._id, function (err, res) {
          should.not.exist(err)
          for (let date of ['creationDate', 'lastModification']) {
            doc[date] = doc[date].toISOString()
          }
          res.should.have.properties(doc)
          res.sides.local.should.equal(1)
          done()
        })
      })
    })

    describe('when a file with the same path exists', function () {
      before('create a file', function (done) {
        this.file = {
          _id: 'FIZZBUZZ.JPG',
          path: 'FIZZBUZZ.JPG',
          docType: 'file',
          checksum: '1111111111111111111111111111111111111111',
          creationDate: new Date(),
          lastModification: new Date(),
          tags: ['foo'],
          size: 12345,
          class: 'image',
          mime: 'image/jpeg'
        }
        this.pouch.db.put(this.file, done)
      })

      it('can update the metadata', function (done) {
        this.merge.ensureParentExist = sinon.stub().yields(null)
        let was = clone(this.file)
        this.file.tags = ['bar', 'baz']
        this.file.lastModification = new Date()
        let doc = clone(this.file)
        delete doc.size
        delete doc.class
        delete doc.mime
        this.file.creationDate = doc.creationDate.toISOString()
        this.file.lastModification = doc.lastModification.toISOString()
        this.merge.updateFile(this.side, doc, err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, (err, res) => {
            should.not.exist(err)
            res.should.have.properties(this.file)
            res.size.should.equal(was.size)
            res.class.should.equal(was.class)
            res.mime.should.equal(was.mime)
            res.sides.local.should.equal(2)
            done()
          })
        })
      })

      it('can overwrite the content of a file', function (done) {
        this.merge.ensureParentExist = sinon.stub().yields(null)
        let doc = {
          _id: 'FIZZBUZZ.JPG',
          path: 'FIZZBUZZ.JPG',
          docType: 'file',
          checksum: '3333333333333333333333333333333333333333',
          tags: ['qux', 'quux']
        }
        this.merge.updateFile(this.side, clone(doc), err => {
          should.not.exist(err)
          this.pouch.db.get(this.file._id, function (err, res) {
            should.not.exist(err)
            res.should.have.properties(doc)
            should.not.exist(res.size)
            should.not.exist(res.class)
            should.not.exist(res.mime)
            res.sides.local.should.equal(3)
            done()
          })
        })
      })
    })
  })

  describe('putFolder', () =>
    it('saves the new folder', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOO/NEW-FOLDER',
        path: 'FOO/NEW-FOLDER',
        docType: 'folder',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      this.merge.putFolder(this.side, doc, err => {
        should.not.exist(err)
        doc.creationDate = doc.creationDate.toISOString()
        doc.lastModification = doc.lastModification.toISOString()
        this.pouch.db.get(doc._id, function (err, res) {
          should.not.exist(err)
          res.should.have.properties(doc)
          res.sides.local.should.equal(1)
          done()
        })
      })
    })
  )

  describe('moveFile', function () {
    it('saves the new file and deletes the old one', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOO/NEW',
        path: 'FOO/NEW',
        checksum: 'ba1368789cce95b574dec70dfd476e61cbf00517',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      let was = {
        _id: 'FOO/OLD',
        path: 'FOO/OLD',
        checksum: 'ba1368789cce95b574dec70dfd476e61cbf00517',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux'],
        sides: {
          local: 1,
          remote: 1
        }
      }
      this.pouch.db.put(clone(was), (err, inserted) => {
        should.not.exist(err)
        was._rev = inserted.rev
        this.merge.moveFile(this.side, clone(doc), clone(was), err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, (err, res) => {
            should.not.exist(err)
            for (let date of ['creationDate', 'lastModification']) {
              doc[date] = doc[date].toISOString()
            }
            res.should.have.properties(doc)
            res.sides.local.should.equal(1)
            this.pouch.db.get(was._id, function (err, res) {
              should.exist(err)
              err.status.should.equal(404)
              done()
            })
          })
        })
      })
    })

    it('adds missing fields', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOO/NEW-MISSING-FIELDS.JPG',
        path: 'FOO/NEW-MISSING-FIELDS.JPG',
        checksum: 'ba1368789cce95b574dec70dfd476e61cbf00517'
      }
      let was = {
        _id: 'FOO/OLD-MISSING-FIELDS.JPG',
        path: 'FOO/OLD-MISSING-FIELDS.JPG',
        checksum: 'ba1368789cce95b574dec70dfd476e61cbf00517',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux'],
        size: 5426,
        class: 'image',
        mime: 'image/jpeg',
        sides: {
          local: 1,
          remote: 1
        }
      }
      this.pouch.db.put(clone(was), (err, inserted) => {
        should.not.exist(err)
        was._rev = inserted.rev
        this.merge.moveFile(this.side, doc, clone(was), err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, function (err, res) {
            should.not.exist(err)
            doc.creationDate = doc.creationDate.toISOString()
            res.should.have.properties(doc)
            should.exist(res.creationDate)
            should.exist(res.size)
            should.exist(res.class)
            should.exist(res.mime)
            done()
          })
        })
      })
    })

    it('adds a hint for writers to know that it is a move', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOO/NEW-HINT',
        path: 'FOO/NEW-HINT',
        checksum: 'ba1368789cce95b574dec70dfd476e61cbf00517',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      let was = {
        _id: 'FOO/OLD-HINT',
        path: 'FOO/OLD-HINT',
        checksum: 'ba1368789cce95b574dec70dfd476e61cbf00517',
        docType: 'file',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux'],
        sides: {
          local: 1,
          remote: 1
        }
      }
      let opts = {
        include_docs: true,
        live: true,
        since: 'now'
      }
      this.pouch.db.put(clone(was), (err, inserted) => {
        should.not.exist(err)
        was._rev = inserted.rev
        this.pouch.db.changes(opts).on('change', function (info) {
          this.cancel()
          info.id.should.equal(was._id)
          info.doc.moveTo.should.equal(doc._id)
          done()
        })
        this.merge.moveFile(this.side, clone(doc), clone(was), err => should.not.exist(err))
      })
    })
  })

  describe('moveFolder', function () {
    it('saves the new folder and deletes the old one', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOOBAR/NEW',
        path: 'FOOBAR/NEW',
        docType: 'folder',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      let was = {
        _id: 'FOOBAR/OLD',
        path: 'FOOBAR/OLD',
        docType: 'folder',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux'],
        sides: {
          local: 1,
          remote: 1
        }
      }
      this.pouch.db.put(clone(was), (err, inserted) => {
        should.not.exist(err)
        was._rev = inserted.rev
        this.merge.moveFolder(this.side, clone(doc), clone(was), err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, (err, res) => {
            should.not.exist(err)
            for (let date of ['creationDate', 'lastModification']) {
              doc[date] = doc[date].toISOString()
            }
            res.should.have.properties(doc)
            res.sides.local.should.equal(1)
            this.pouch.db.get(was._id, function (err, res) {
              should.exist(err)
              err.status.should.equal(404)
              done()
            })
          })
        })
      })
    })

    it('adds a hint for writers to know that it is a move', function (done) {
      this.merge.ensureParentExist = sinon.stub().yields(null)
      let doc = {
        _id: 'FOOBAR/NEW-HINT',
        path: 'FOOBAR/NEW-HINT',
        docType: 'folder',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux']
      }
      let was = {
        _id: 'FOOBAR/OLD-HINT',
        path: 'FOOBAR/OLD-HINT',
        docType: 'folder',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: ['courge', 'quux'],
        sides: {
          local: 1,
          remote: 1
        }
      }
      let opts = {
        include_docs: true,
        live: true,
        since: 'now'
      }
      this.pouch.db.put(clone(was), (err, inserted) => {
        should.not.exist(err)
        was._rev = inserted.rev
        this.pouch.db.changes(opts).on('change', function (info) {
          this.cancel()
          info.id.should.equal(was._id)
          info.doc.moveTo.should.equal(doc._id)
          done()
        })
        this.merge.moveFolder(this.side, clone(doc), clone(was), err => should.not.exist(err))
      })
    })
  })

  describe('moveFolderRecursively', function () {
    before(function (done) {
      pouchHelpers.createParentFolder(this.pouch, () => {
        pouchHelpers.createFolder(this.pouch, 9, () => {
          pouchHelpers.createFile(this.pouch, 9, done)
        })
      })
    })

    it('move the folder and files/folders inside it', function (done) {
      let doc = {
        _id: 'DESTINATION',
        path: 'DESTINATION',
        docType: 'folder',
        creationDate: new Date(),
        lastModification: new Date(),
        tags: []
      }
      this.pouch.db.get('my-folder', (err, was) => {
        should.not.exist(err)
        this.merge.moveFolderRecursively('local', doc, was, err => {
          should.not.exist(err)
          let ids = ['', '/folder-9', '/file-9']
          async.eachSeries(ids, (id, next) => {
            this.pouch.db.get(`DESTINATION${id}`, (err, res) => {
              should.not.exist(err)
              should.exist(res)
              should(res.path).eql(`DESTINATION${id}`)
              if (id !== '') { // parent sides are updated in moveFolderAsync()
                should(res.sides).have.properties({
                  local: 2,
                  remote: 1
                })
              }
              this.pouch.db.get(`my-folder${id}`, function (err, res) {
                err.status.should.equal(404)
                next()
              })
            })
          }, done)
        })
      })
    })
  })

  describe('deleteFile', () =>
    it('deletes a file', function (done) {
      let doc = {
        _id: 'TO-DELETE/FILE',
        path: 'TO-DELETE/FILE',
        docType: 'file',
        sides: {
          local: 1
        }
      }
      this.pouch.db.put(doc, err => {
        should.not.exist(err)
        this.merge.deleteFile(this.side, doc, err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, function (err) {
            err.status.should.equal(404)
            done()
          })
        })
      })
    })
  )

  describe('deleteFolder', function () {
    it('deletes a folder', function (done) {
      let doc = {
        _id: 'TO-DELETE/FOLDER',
        path: 'TO-DELETE/FOLDER',
        docType: 'folder',
        sides: {
          local: 1
        }
      }
      this.pouch.db.put(doc, err => {
        should.not.exist(err)
        this.merge.deleteFolder(this.side, doc, err => {
          should.not.exist(err)
          this.pouch.db.get(doc._id, function (err, res) {
            err.status.should.equal(404)
            done()
          })
        })
      })
    })

    it('remove files in the folder', function (done) {
      let doc = {
        _id: 'FOO/TO-REMOVE',
        path: 'FOO/TO-REMOVE',
        docType: 'folder',
        sides: {
          local: 1
        }
      }
      this.pouch.db.put(doc, err => {
        should.not.exist(err)
        async.eachSeries(['baz', 'qux', 'quux'], (name, next) => {
          let file = {
            _id: `FOO/TO-REMOVE/${name}`,
            path: `FOO/TO-REMOVE/${name}`,
            docType: 'file'
          }
          this.pouch.db.put(file, next)
        }, err => {
          should.not.exist(err)
          this.merge.deleteFolder(this.side, doc, err => {
            should.not.exist(err)
            this.pouch.byPath('FOO/TO-REMOVE', function (_, docs) {
              docs.length.should.be.equal(0)
              done()
            })
          })
        })
      })
    })

    it('remove nested folders', function (done) {
      let base = 'NESTED/TO-DELETE'
      async.eachSeries(['', '/b', '/b/c', '/b/d'], (name, next) => {
        let doc = {
          _id: `${base}${name}`,
          path: `${base}${name}`,
          docType: 'folder',
          sides: {
            local: 1
          }
        }
        this.pouch.db.put(doc, next)
      }, err => {
        should.not.exist(err)
        this.merge.deleteFolder(this.side, {_id: base, path: base}, err => {
          should.not.exist(err)
          this.pouch.db.allDocs(function (err, res) {
            should.not.exist(err)
            for (let row of Array.from(res.rows)) {
              row.id.should.not.match(/^NESTED/i)
            }
            done()
          })
        })
      })
    })
  })

  describe('trashAsync', () => {
    context('when metadata are found in Pouch', () => {
      it('updates it with toBeTrashed property and up-to-date sides info', async function () {
        const doc = {_id: 'existing-metadata'}
        await this.pouch.db.put({...doc, sides: {local: 1, remote: 1}})

        await this.merge.trashAsync(this.side, doc)

        const updated = await this.pouch.db.get(doc._id)
        should(updated).have.properties({
          ...doc,
          toBeTrashed: true,
          sides: {
            local: 2,
            remote: 1
          }
        })
      })
    })

    context('when metadata are not found in Pouch', () => {
      it('does nothing', async function () {
        const doc = {_id: 'missing-metadata'}

        await this.merge.trashAsync(this.side, doc)

        await should(this.pouch.db.get(doc._id))
          .be.rejectedWith({status: 404})
      })
    })

    context('when docType does not match', () => {
      it('tries to resolve the conflict', async function () {
        this.merge.local = {resolveConflictAsync: sinon.stub()}
        this.merge.local.resolveConflictAsync.returnsPromise().resolves()

        const doc = {_id: 'conflicting-doctype', docType: 'folder', path: 'conflicting-doctype'}
        await this.pouch.db.put({...doc, docType: 'file'})

        await this.merge.trashAsync(this.side, doc)

        should(this.merge.local.resolveConflictAsync).have.been.calledOnce()
        const [dst, src] = this.merge.local.resolveConflictAsync.getCall(0).args
        should(src).eql(doc)
        should(dst).have.properties({...doc, path: dst.path})
        should(dst.path).match(/conflict/)
        should(dst).not.have.property('toBeTrashed')
      })
    })
  })
})
