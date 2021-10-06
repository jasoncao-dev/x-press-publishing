const express = require('express')
const seriesRouter = express.Router()

const issuesRouter = require('./issues.js')

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get('SELECT * FROM Series WHERE id = $seriesId', { $seriesId: seriesId }, (error, series) => {
        if (error) {
            next(error)
        } else if (series) {
            req.series = series
            next()
        } else {
            res.status(404).send()
        }
    })
})

seriesRouter.use('/:seriesId/issues', issuesRouter)

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (error, series) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({series: series})
        }
    })
})

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series})
})

seriesRouter.post('/', (req, res, next) => {
    const { name, description } = req.body.series
    if (!(name && description)) {
        return res.sendStatus(400)
    }
    db.run(`INSERT INTO Series (name, description)
            VALUES ($name, $description)`,
            {
                $name: name,
                $description: description
            },
            function (error) {
                if (error) {
                    next(error)
                } else {
                    db.get('SELECT * FROM Series WHERE id = $id', { $id: this.lastID }, (error, series) => {
                        if (error) {
                            next(error)
                        } else {
                            res.status(201).json({series: series})
                        }
                    })
                }
            })
})

seriesRouter.put('/:seriesId', (req, res, next) => {
    const { name, description } = req.body.series
    const id = req.params.seriesId
    if (!(name && description)) {
        return res.sendStatus(400)
    }
    db.run(`UPDATE Series
            SET name = $name,
                description = $description
            WHERE id = $id`, 
            {
                $name: name,
                $description: description,
                $id: id
            },
            (error) => {
                if (error) {
                    next(error)
                } else {
                    db.get('SELECT * FROM Series WHERE id = $id', { $id: id }, (error, series) => {
                        if (error) {
                            next(error)
                        } else {
                            res.status(200).json({series: series})
                        }
                    })
                }
            })
})

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSQL = 'SELECT * FROM Issue WHERE series_id = $seriesId'
    const seriesId = req.params.seriesId
    const seriesSQL = 'DELETE FROM Series WHERE id = $seriesId'
    db.get(issueSQL, { $seriesId: seriesId }, (error, issue) => {
        if (error) {
            next(error)
        } else if (issue) { //found a series has related issues
            return res.sendStatus(400)
        } else {
            db.run(seriesSQL, { $seriesId: seriesId }, (error) => {
                if (error) {
                    next(error)
                } else {
                    res.sendStatus(204)
                }
            })
        }
    })
})

module.exports = seriesRouter