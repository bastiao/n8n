/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Request, Response } from 'express';
import { Db, ResponseHelper } from '../..';
import { issueJWT } from '../auth/jwt';
import { N8nApp, PublicUserData } from '../Interfaces';

export function addAuthenticationMethods(this: N8nApp): void {
	// ----------------------------------------
	// login a user
	// ----------------------------------------

	this.app.post(
		`/${this.restEndpoint}/login`,
		ResponseHelper.send(async (req: Request, res: Response): Promise<PublicUserData> => {
			if (!req.body.email) {
				throw new Error('Email is required to log in');
			}

			if (!req.body.password) {
				throw new Error('Password is required to log in');
			}

			let user;
			try {
				user = await Db.collections.User!.findOne({
					email: req.body.email as string,
					password: req.body.password as string,
				});
			} catch (error) {
				throw new Error('Unable to access database.');
			}
			if (!user) {
				const error = new Error('User not found');
				// @ts-ignore
				error.httpStatusCode = 404;
				throw error;
			}

			const userData = await issueJWT(user);
			res.cookie('n8n-auth', userData.token, { maxAge: userData.expiresIn, secure: true });
			const { id, email, firstName, lastName, personalizationAnswers, password } = user;

			return {
				id,
				email,
				firstName,
				lastName,
				personalizationAnswers,
				password: password.slice(Math.round(password.length / 2)),
			};
		}),
	);
}
