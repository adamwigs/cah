import { UpdateUsernameRequest } from './update-username-request';

describe('[Class] UpdateUsernameRequest', () => {

    const uur = new UpdateUsernameRequest('pid-string', 'new-username', 'foo');

    it('pid should be \'pid-string\'', () => {
        expect(uur.pid).toEqual('pid-string');
    });

    it('username should be \'new-username\'', () => {
        expect(uur.username).toEqual('new-username');
    });

    it('emoji should be \'foo\'', () => {
        expect(uur.emoji).toEqual('foo');
    });

});
