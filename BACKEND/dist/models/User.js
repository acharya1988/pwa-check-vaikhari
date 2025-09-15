export function defaultNewUser(uid, partial) {
    const now = new Date();
    return {
        _id: uid,
        roles: ["user"],
        status: "active",
        mfaEnrolled: false,
        createdAt: now,
        lastLoginAt: now,
        ...partial,
    };
}
