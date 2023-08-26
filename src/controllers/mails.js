import fs from 'fs/promises'
import path from 'path'
import nodemailer from 'nodemailer'

export default class Mails {
  static _instance

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })

  constructor(logger) {
    this.logger = logger
  }

  static getInstance(logger) {
    if (!Mails._instance) {
      Mails._instance = new Mails(logger)
    }
    return Mails._instance
  }

  async sendOTP(subject, to, fullname, otp) {
    try {
      const template = (await fs.readFile(path.join(
        process.cwd(),
        'assets',
        'otp.html'
      )))
        .toString()

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: template
          .replace('{{fullname}}', fullname)
          .replace('{{otp}}', otp)
      })
      return
    } catch (err) {
      this.logger.error(err)
      return
    }
  }
}
